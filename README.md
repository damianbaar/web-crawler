# web-crawler

Simple webcrawler which follow the links `<a href>'s` within the same domain.

### Parts / Structure
- `page-parser` - getting source of html and following the link within it
- `web-crawler-lambda` - lambda service with embeded `page-parser`
- `web-crawler-ui` - basic user interface for `web-crawler` - #TODO

### How to ...

#### ... run lambda
* `goto` folder `packages/web-crawler-tools` and run `yarn run offline`
* after compilation happen you can navigate to `localhost:8080/get-site-map`
* to run on custom page, use query string, like so `http://localhost:8080/get-site-map?page=http://www.google.com`

### ... run in development mode
* get `nixpkg` via `curl https://nixos.org/nix/install | sh`
* clone this repo
* within folder run `shell nix` command

### ... run tests and lints
* `unit tests` - `yarn test:unit`
* `lints` - `yarn lint`

#### ... run  watch mode
Just append at the end `--watch` param

### ... deploy
* first familiarize with [sls deploy](https://serverless.com/framework/docs/providers/aws/guide/deploying/)

#### Setup

##### AWS Credentials
```  
serverless config credentials --provider aws --key YOUR_ACCESS_KEY --secret YOUR_SECRET_KEY
```

#### For `zsh` users
* as you will spawn another shell via `nix shell` some of aliases / commands / paths would not work, however if you are an `zsh` user it should be seamless, assuming your `zsh` config lives within home directory, this is `~/.zshrc` if not, override `zdotdir/zshenv` before running `nix-shell` and apply necessary config.

#### Some why's
* [`nix-shell`](https://nixos.org/nixos/nix-pills/developing-with-nix-shell.html) - to get fully isolated, reproducible environment with all `node.js` dependencies without global flag required
* [`serverless`](https://serverless.com/) - easy to setup, test and deploy to cloud and locally, no vendor lock in
* [`lambda`](https://aws.amazon.com/lambda/) - there is no point to hold an instance like `EC2` for [`RPC`](https://en.wikipedia.org/wiki/Remote_procedure_call) like call
* [`yarn workspaces`](https://yarnpkg.com/lang/en/docs/workspaces/) - to have clean view on `npm` dependency tree and to have more meaningful parts of app