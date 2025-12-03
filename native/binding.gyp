{
  "targets": [
    {
      "target_name": "ssz_native",
      "sources": [
        "src/sha256_native.cc",
        "src/sha256_fallback.cc",
        "src/addon.cc"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "src"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"],
      "conditions": [
        [
          "OS=='win'",
          {
            "msvs_settings": {
              "VCCLCompilerTool": {
                "ExceptionHandling": 1,
                "EnableEnhancedInstructionSet": "5"
              }
            }
          }
        ],
        [
          "OS=='linux'",
          {
            "cflags_cc": [
              "-msha",
              "-msse4.1",
              "-msse4.2",
              "-O3"
            ]
          }
        ],
        [
          "OS=='mac'",
          {
            "xcode_settings": {
              "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
              "CLANG_CXX_LIBRARY": "libc++",
              "MACOSX_DEPLOYMENT_TARGET": "10.13",
              "OTHER_CFLAGS": [
                "-march=native",
                "-O3"
              ]
            }
          }
        ]
      ]
    }
  ]
}
