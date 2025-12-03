/**
 * Node.js addon entry point
 */

#include <napi.h>

// Import functions from sha256_native.cc
extern Napi::Value HashLeaf(const Napi::CallbackInfo& info);
extern Napi::Value HashParent(const Napi::CallbackInfo& info);
extern Napi::Value HasNativeSupport(const Napi::CallbackInfo& info);
extern Napi::Value GetImplementation(const Napi::CallbackInfo& info);

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("hashLeaf", Napi::Function::New(env, HashLeaf));
  exports.Set("hashParent", Napi::Function::New(env, HashParent));
  exports.Set("hasNativeSupport", Napi::Function::New(env, HasNativeSupport));
  exports.Set("getImplementation", Napi::Function::New(env, GetImplementation));
  return exports;
}

NODE_API_MODULE(ssz_native, Init)
