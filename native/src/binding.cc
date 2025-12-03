#include <napi.h>
#include "sha256_native.h"

namespace ssz_binding {

// Hash single buffer
Napi::Value Hash(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsBuffer()) {
        Napi::TypeError::New(env, "Buffer expected").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    Napi::Buffer<uint8_t> buffer = info[0].As<Napi::Buffer<uint8_t>>();
    const uint8_t* data = buffer.Data();
    size_t len = buffer.Length();
    
    Napi::Buffer<uint8_t> result = Napi::Buffer<uint8_t>::New(env, 32);
    ssz_native::sha256_hash(data, len, result.Data());
    
    return result;
}

// Hash two 32-byte buffers (optimized for merkle trees)
Napi::Value HashPair(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2 || !info[0].IsBuffer() || !info[1].IsBuffer()) {
        Napi::TypeError::New(env, "Two buffers expected").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    Napi::Buffer<uint8_t> left = info[0].As<Napi::Buffer<uint8_t>>();
    Napi::Buffer<uint8_t> right = info[1].As<Napi::Buffer<uint8_t>>();
    
    if (left.Length() != 32 || right.Length() != 32) {
        Napi::TypeError::New(env, "Both buffers must be 32 bytes").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    Napi::Buffer<uint8_t> result = Napi::Buffer<uint8_t>::New(env, 32);
    ssz_native::sha256_hash_pair(left.Data(), right.Data(), result.Data());
    
    return result;
}

// Check if hardware acceleration is available
Napi::Value HasShaExtensions(const Napi::CallbackInfo& info) {
    return Napi::Boolean::New(info.Env(), ssz_native::has_sha_extensions());
}

// Get implementation name
Napi::Value GetImplementationName(const Napi::CallbackInfo& info) {
    return Napi::String::New(info.Env(), ssz_native::get_implementation_name());
}

// Initialize addon
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("hash", Napi::Function::New(env, Hash));
    exports.Set("hashPair", Napi::Function::New(env, HashPair));
    exports.Set("hasShaExtensions", Napi::Function::New(env, HasShaExtensions));
    exports.Set("getImplementationName", Napi::Function::New(env, GetImplementationName));
    return exports;
}

NODE_API_MODULE(ssz_native, Init)

} // namespace ssz_binding
