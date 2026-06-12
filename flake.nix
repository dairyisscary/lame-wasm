{
  description = "LAME MP3 Encoder, but WASM";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs = inputs: (import ./nix/lib.nix { inherit inputs; }).forEachSystem (pkgs:
    let
      inherit (pkgs) lib;
    in
    {
      formatter = pkgs.nixpkgs-fmt;

      devShells.default = pkgs.mkMinimalShell {
        name = "lame-wasm-devshell";

        packages = [
        ];

        shellHook = "";
      };
    });
}
