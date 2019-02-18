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

  runScript = pkgs.writeShellScriptBin "run-ts-script" ''
    node --require @hungry/babel-preset-cli/register $1
  '';
in
stdenv.mkDerivation rec {
    name = "dev-env";
    baseInputs = [
    ];
    buildInputs = [
      # init
      initEnv
      # helpers
      runScript

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
        echo "welcome in my world"
        source init-environment
        source init-git-subrepo
        yarn install
        echo "Hey Hey Hey, have a happy time!"
      '';
    };
}