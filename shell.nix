{ pkgs ? import <nixpkgs> {}
, zdotdir ? import (builtins.fetchurl {
    url = "https://gist.githubusercontent.com/damianbaar/57aff242d06c75444dbd36bf5400060e/raw/83d074d45c81a18402146cadc595a20b91bb1985/zdotdir.nix";
  }) { inherit pkgs; }
}:
with import <nixpkgs> {};
let
  initEnv = pkgs.writeShellScriptBin "init-environment" ''
    export BABEL_ENV=development
    export PATH="$PWD/node_modules/.bin/:$PATH"
    export PATH="$HOME/.yarn/bin:$HOME/.config/yarn/global/node_modules/.bin:$PATH"
    export ROOT_PROJECT_FOLDER=$PWD
  '';
in
stdenv.mkDerivation rec {
    name = "dev-env";
    baseInputs = [
    ];
    buildInputs = [
      # init
      initEnv

      # deps
      awscli
      git
      yarn
      nodejs-10_x
    ];

    shellHook= zdotdir {
      zshenv = builtins.path { path = ./zdotdir/zshrc; };
      zshrc = builtins.path { path = ./zdotdir/zshenv; };

      shellHook= ''
        source init-environment
        yarn install
        echo "Hey Hey Hey, have a happy time!"
      '';
    };
}