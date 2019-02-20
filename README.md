# web-crawler

Simple webcrawler which follow the links `<a href>'s` within the same domain.

### Parts / Structure
- [`page-parser`](https://github.com/damianbaar/web-crawler/tree/master/packages/page-parser) - getting source of html and following the links page
- [`web-crawler-lambda`](https://github.com/damianbaar/web-crawler/tree/master/packages/web-crawler-lambda) - lambda service with embeded `page-parser`
- [`web-crawler-ui`](https://github.com/damianbaar/web-crawler/tree/master/packages/web-crawler-ui) - basic user interface for `web-crawler` - #TODO

### How to ...

### ... run in local / development mode
* get `nixpkg` via `curl https://nixos.org/nix/install | sh`
* clone this repo
* within folder run `nix-shell` command

#### ... run lambda
* `goto` folder `packages/web-crawler-lambda` and run `yarn run offline` or with logging enabled `DEBUG=log:parser yarn run offline`
* after compilation you can navigate to `localhost:8080/get-site-map`
* to run on custom page, use query string, like so `http://localhost:8080/get-site-map?page=http://www.google.com`

### ... run tests and lints
* `unit tests` - `yarn test:unit`
* `lints` - `yarn lint`
* `integration tests` - goto `packages/web-crawler-lambda' and run `yarn run test'

#### ... run  watch mode
Just append at the end `--watch` for test command, this is, `yarn test:unit --watch`

### ... deploy
* setup your aws credentials - more details below
* goto `packages/web-crawler-lambda` and run `yarn run deploy`
[More about serverless deploy](https://serverless.com/framework/docs/providers/aws/guide/deploying/)

#### Setup

##### AWS Credentials
```  
serverless config credentials --provider aws --key YOUR_ACCESS_KEY --secret YOUR_SECRET_KEY
```
More [here](https://serverless.com/framework/docs/providers/aws/guide/credentials/).

#### Some why's
* [`nix-shell`](https://nixos.org/nixos/nix-pills/developing-with-nix-shell.html) - to get fully isolated, reproducible environment with all `node.js` dependencies without global flag required
* [`serverless`](https://serverless.com/) - easy to setup, test and deploy to cloud and locally, no vendor lock in
* [`lambda`](https://aws.amazon.com/lambda/) - there is no point to hold an instance like `EC2` for [`RPC`](https://en.wikipedia.org/wiki/Remote_procedure_call) like call
* [`yarn workspaces`](https://yarnpkg.com/lang/en/docs/workspaces/) - to have clean view on `npm` dependency tree and to have more meaningful parts of app

#### For `zsh` users
* as you will spawn another shell via `nix shell` some of aliases / commands / paths would not work, however if you are an `zsh` user it should be seamless, assuming your `zsh` config lives within home directory, this is `~/.zshrc` if not, override `zdotdir/zshenv` before running `nix-shell` and apply necessary config.
