"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SszError = exports.TypeKind = void 0;
var TypeKind;
(function (TypeKind) {
    TypeKind[TypeKind["Basic"] = 0] = "Basic";
    TypeKind[TypeKind["Vector"] = 1] = "Vector";
    TypeKind[TypeKind["List"] = 2] = "List";
    TypeKind[TypeKind["Container"] = 3] = "Container";
    TypeKind[TypeKind["Bitlist"] = 4] = "Bitlist";
})(TypeKind || (exports.TypeKind = TypeKind = {}));
var SszError;
(function (SszError) {
    SszError[SszError["None"] = 0] = "None";
    SszError[SszError["BadOffset"] = 1] = "BadOffset";
    SszError[SszError["NonCanonical"] = 2] = "NonCanonical";
    SszError[SszError["BitlistPadding"] = 3] = "BitlistPadding";
    SszError[SszError["UnsupportedType"] = 4] = "UnsupportedType";
    SszError[SszError["MalformedHeader"] = 5] = "MalformedHeader";
    SszError[SszError["LengthOverflow"] = 6] = "LengthOverflow";
    SszError[SszError["UnexpectedEOF"] = 7] = "UnexpectedEOF";
})(SszError || (exports.SszError = SszError = {}));
