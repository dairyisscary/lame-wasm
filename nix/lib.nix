{ inputs }:
let
  inherit (inputs) nixpkgs;
  inherit (nixpkgs) lib;

  isCoreUtils = lib.hasPrefix "coreutils";
  # Overlay for "minimal" stdenv and shells without a compiler few environment modifications
  minimalShellOverlay = final: prev: {
    minimalStdenv = prev.stdenvNoCC.override {
      cc = null;
      preHook = "";
      allowedRequisites = null;
      initialPath = builtins.filter (a: isCoreUtils a.name) prev.stdenvNoCC.initialPath;
      extraNativeBuildInputs = [ ];
    };
    mkMinimalShell = prev.mkShell.override { stdenv = final.minimalStdenv; };
  };

  selfLib = {
    # Fold flake outputs for each system
    forEachSystem = fn: builtins.foldl'
      (outputs: system:
        let
          pkgs = import nixpkgs {
            inherit system;
            overlays = [ minimalShellOverlay ];
          };
          mergeOutputs = accum: outputName: output: accum // {
            ${outputName} = (accum.${outputName} or { }) // { ${system} = output; };
          };
        in
        lib.foldlAttrs mergeOutputs outputs (fn pkgs))
      { lib = selfLib; }
      [ "aarch64-darwin" "aarch64-linux" "x86_64-linux" ];
  };
in
selfLib
