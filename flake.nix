{
  description = "LAME MP3 Encoder, but WASM";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs = inputs: (import ./nix/lib.nix { inherit inputs; }).forEachSystem (pkgs:
    let
      inherit (pkgs) lib;

      lameBaseline = pkgs.lame.override {
        analyzerHooksSupport = false;
        decoderSupport = false;
        frontendSupport = false;
        nasmSupport = false;
      };
      lameWasmLib = pkgs.mkWasmDerivation {
        inherit (lameBaseline) pname version src preConfigure;

        configureFlags = lameBaseline.configureFlags ++ [
          "--disable-dependency-tracking"
          "--disable-shared"
          "--disable-gtktest"
          "--host=${pkgs.emscriptenStdenv.buildPlatform.config}"
        ];

        configurePhase = ''
          runHook preConfigure

          emconfigure ./configure \
            --prefix=$out \
            CFLAGS="-DNDEBUG -DNO_STDIO $wasmOptimizeFlags" \
            $configureFlags

          runHook postConfigure
        '';

        installPhase = ''
          runHook preInstall

          mkdir -p $out/{lib,include}

          cp include/*.h $out/include
          cp libmp3lame/.libs/*.a $out/lib

          runHook postInstall
        '';

        meta = builtins.removeAttrs lameBaseline.meta [ "mainProgram" ];
      };

      lameWasmBridge = pkgs.mkWasmDerivation {
        pname = "lame-wasm-bridge";
        version = "1.0.0";
        dontConfigure = true;
        dontInstall = true;

        src = lib.fileset.toSource {
          root = ./src;
          fileset = lib.fileset.fileFilter (file: lib.hasSuffix ".c" file.name) ./src;
        };

        buildInputs = [
          lameWasmLib
        ];

        buildPhase = ''
          runHook preBuild

          mkdir -p $out/lib

          emcc \
            $wasmOptimizeFlags \
            -I${lameWasmLib}/include \
            $src/bindings.c ${lameWasmLib}/lib/libmp3lame.a \
            -s STRICT=1 \
            -s MODULARIZE=1 \
            -s EXPORT_ES6=1 \
            -s SINGLE_FILE=1 \
            -s ALLOW_MEMORY_GROWTH=1 \
            -s INCOMING_MODULE_JS_API=[] \
            -s ENVIRONMENT=web,worker \
            -s EXPORTED_RUNTIME_METHODS=HEAPU8 \
            -s EXPORTED_FUNCTIONS=_malloc,_free \
            -o $out/lib/index.js

          runHook postBuild
        '';
      };

      nodejs = pkgs.nodejs-slim_24;
      corepackShims = pkgs.runCommand "node-package-managers" { } ''
        mkdir -p $out/bin
        ${nodejs.corepack}/bin/corepack enable --install-directory $out/bin npm pnpm yarn
      '';
    in
    {
      formatter = pkgs.nixpkgs-fmt;

      devShells.default = pkgs.mkMinimalShell {
        name = "lame-wasm-devshell";

        packages = [
          corepackShims
          (pkgs.typescript-language-server.override { inherit nodejs; })
          nodejs.out
        ];

        shellHook = ''
          export PATH="${builtins.getEnv "PWD"}/node_modules/.bin:$PATH"
          export LAME_WASM_BRIDGE="${lameWasmBridge}"
        '';
      };

      packages.lame-wasm-bridge = lameWasmBridge;
      packages.lame-wasm-lib = lameWasmLib;
    });
}
