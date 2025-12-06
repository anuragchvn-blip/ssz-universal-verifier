"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseToRanges = parseToRanges;
const types_js_1 = require("./types.js");
/* Canonical parsing: container offsets, bitlist validation, strict checks */
function parseToRanges(td, bytes) {
    if (td.kind === types_js_1.TypeKind.Basic) {
        if (td.fixedSize === undefined)
            return { ranges: [], error: types_js_1.SszError.UnsupportedType, msg: 'Basic type missing fixedSize' };
        if (td.fixedSize === 0) {
            // Variable-length bytes
            return { ranges: [{ start: 0, end: bytes.length }], error: types_js_1.SszError.None, msg: '' };
        }
        if (bytes.length !== td.fixedSize)
            return { ranges: [], error: types_js_1.SszError.NonCanonical, msg: 'Basic type length mismatch' };
        return { ranges: [{ start: 0, end: bytes.length }], error: types_js_1.SszError.None, msg: '' };
    }
    if (td.kind === types_js_1.TypeKind.Bitlist) {
        if (bytes.length === 0)
            return { ranges: [], error: types_js_1.SszError.NonCanonical, msg: 'Bitlist empty' };
        const lastByte = bytes[bytes.length - 1];
        if (lastByte === 0)
            return { ranges: [], error: types_js_1.SszError.BitlistPadding, msg: 'Bitlist sentinel missing' };
        let bitLen = (bytes.length - 1) * 8;
        let sentinel = lastByte;
        while (sentinel > 1) {
            bitLen++;
            sentinel >>= 1;
        }
        const paddingBits = (bytes.length * 8) - bitLen - 1;
        // Fix: prevent overflow for paddingBits >= 31
        if (paddingBits >= 31)
            return { ranges: [], error: types_js_1.SszError.BitlistPadding, msg: 'Bitlist padding overflow' };
        const mask = (1 << paddingBits) - 1;
        if ((lastByte & mask) !== 0)
            return { ranges: [], error: types_js_1.SszError.BitlistPadding, msg: 'Bitlist padding non-zero' };
        return { ranges: [{ start: 0, end: bytes.length }], error: types_js_1.SszError.None, msg: '' };
    }
    if (td.kind === types_js_1.TypeKind.List || td.kind === types_js_1.TypeKind.Vector) {
        if (!td.elementType)
            return { ranges: [], error: types_js_1.SszError.UnsupportedType, msg: 'List/Vector missing elementType' };
        const eleFixed = td.elementType.fixedSize;
        if (eleFixed !== undefined && eleFixed > 0) {
            const count = bytes.length / eleFixed;
            if (!Number.isInteger(count))
                return { ranges: [], error: types_js_1.SszError.NonCanonical, msg: 'List fixed-size element misalignment' };
            const ranges = [];
            for (let i = 0; i < count; i++) {
                ranges.push({ start: i * eleFixed, end: (i + 1) * eleFixed });
            }
            return { ranges, error: types_js_1.SszError.None, msg: '' };
        }
        else {
            return parseVariableList(bytes);
        }
    }
    if (td.kind === types_js_1.TypeKind.Container) {
        if (!td.fieldTypes || td.fieldTypes.length === 0)
            return { ranges: [{ start: 0, end: bytes.length }], error: types_js_1.SszError.None, msg: '' };
        const fixedFields = td.fieldTypes.map(ft => ft.fixedSize !== undefined && ft.fixedSize > 0);
        const varCount = fixedFields.filter(f => !f).length;
        if (varCount === 0) {
            let totalFixedSize = 0;
            for (const ft of td.fieldTypes)
                totalFixedSize += ft.fixedSize;
            if (bytes.length !== totalFixedSize)
                return { ranges: [], error: types_js_1.SszError.MalformedHeader, msg: 'Container length mismatch' };
            let offset = 0;
            const ranges = [];
            for (const ft of td.fieldTypes) {
                const size = ft.fixedSize;
                ranges.push({ start: offset, end: offset + size });
                offset += size;
            }
            if (offset !== bytes.length)
                return { ranges: [], error: types_js_1.SszError.NonCanonical, msg: 'Container trailing bytes' };
            return { ranges, error: types_js_1.SszError.None, msg: '' };
        }
        else {
            return parseVariableContainer(td, bytes, fixedFields);
        }
    }
    return { ranges: [], error: types_js_1.SszError.UnsupportedType, msg: 'Unknown TypeKind' };
}
function parseVariableList(bytes) {
    if (bytes.length < 4)
        return { ranges: [], error: types_js_1.SszError.MalformedHeader, msg: 'Variable list too short for offsets' };
    const offsets = [];
    let i = 0;
    while (i + 4 <= bytes.length) {
        const off = readU32LE(bytes, i);
        if (off < i + 4)
            break;
        offsets.push(off);
        i += 4;
    }
    if (offsets.length === 0)
        return { ranges: [], error: types_js_1.SszError.MalformedHeader, msg: 'No offsets found' };
    const headerEnd = offsets[0];
    if (headerEnd !== offsets.length * 4)
        return { ranges: [], error: types_js_1.SszError.BadOffset, msg: 'Offset table misalignment' };
    for (let j = 1; j < offsets.length; j++) {
        if (offsets[j] <= offsets[j - 1])
            return { ranges: [], error: types_js_1.SszError.BadOffset, msg: 'Offsets not strictly increasing' };
    }
    if (offsets[offsets.length - 1] > bytes.length)
        return { ranges: [], error: types_js_1.SszError.LengthOverflow, msg: 'Offset beyond buffer' };
    if (offsets[offsets.length - 1] !== bytes.length)
        return { ranges: [], error: types_js_1.SszError.NonCanonical, msg: 'Trailing bytes in list' };
    const ranges = [];
    for (let j = 0; j < offsets.length; j++) {
        const start = offsets[j];
        const end = j + 1 < offsets.length ? offsets[j + 1] : bytes.length;
        ranges.push({ start, end });
    }
    return { ranges, error: types_js_1.SszError.None, msg: '' };
}
function parseVariableContainer(td, bytes, fixedFields) {
    const fieldCount = fixedFields.length;
    let fixedSize = 0;
    let varCount = 0;
    for (let i = 0; i < fieldCount; i++) {
        if (fixedFields[i]) {
            fixedSize += td.fieldTypes[i].fixedSize;
        }
        else {
            fixedSize += 4;
            varCount++;
        }
    }
    if (bytes.length < fixedSize)
        return { ranges: [], error: types_js_1.SszError.MalformedHeader, msg: 'Container too short' };
    const offsets = [];
    let byteOffset = 0;
    for (let i = 0; i < fieldCount; i++) {
        if (fixedFields[i]) {
            byteOffset += td.fieldTypes[i].fixedSize;
        }
        else {
            const off = readU32LE(bytes, byteOffset);
            offsets.push(off);
            byteOffset += 4;
        }
    }
    const headerEnd = fixedSize;
    for (const off of offsets) {
        if (off < headerEnd)
            return { ranges: [], error: types_js_1.SszError.BadOffset, msg: 'Offset points into header' };
        if (off > bytes.length)
            return { ranges: [], error: types_js_1.SszError.LengthOverflow, msg: 'Offset beyond buffer' };
    }
    for (let i = 1; i < offsets.length; i++) {
        if (offsets[i] <= offsets[i - 1])
            return { ranges: [], error: types_js_1.SszError.BadOffset, msg: 'Offsets not strictly increasing' };
    }
    const ranges = [];
    let fixedOff = 0;
    let varIdx = 0;
    for (let i = 0; i < fieldCount; i++) {
        if (fixedFields[i]) {
            const size = td.fieldTypes[i].fixedSize;
            ranges.push({ start: fixedOff, end: fixedOff + size });
            fixedOff += size;
        }
        else {
            fixedOff += 4;
            const start = offsets[varIdx];
            const end = varIdx + 1 < offsets.length ? offsets[varIdx + 1] : bytes.length;
            ranges.push({ start, end });
            varIdx++;
        }
    }
    return { ranges, error: types_js_1.SszError.None, msg: '' };
}
function readU32LE(bytes, offset) {
    // Fix: use unsigned right-shift to prevent sign extension and ensure result is non-negative
    return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}
//# sourceMappingURL=sszParser.js.map