# To Do

- Add types for wrapped ethers
- Remove duplicate types between NPM and wallet (like UnpopulatedTransaction)
- naming of `unpopulatedTransaction: PopulatedTransaction` in `interceptTransaction.ts` and `transact.ts` is very confusing. PopulatedTransaction is an ethers type but it's not what we call a PopulatedTranaction in `wallet`. Fix this.
- Have RPC return correct address when ethers calls `eth_accounts` (currently hard coded)

# Setting up local development

From the root directory of this project:

```
yarn link
yarn install
cd node_modules/react
yarn link
cd ../../node_modules/react-dom
yarn link
cd ../..
yarn build
```

The last line of the previous commands will watch for changes and the UI will automatically update after you link.

Then, from the root directory of the UI project

```
yarn link ethos-wallet-beta
yarn link react
yarn link react-dom
yarn dev
```

If something messes up, you can reset all your linked packages by running (mac only):

```
rm -rf cd ~/.config/yarn/*
```

Or, for windows powershell:

```
Remove-Item C:\Users\<USERNAME>\AppData\Local\Yarn\Data\link\* -Recurse -Force
```

To reset your UI back to normal, simply run:

```
yarn unlink ethos-wallet-beta
yarn unlink react
yarn unlink react-dom
yarn add ethos-wallet-beta react react-dom
```

# Publishing

When you're ready to publish your changes, update the `package.json` file with a new version number following [Semantic Versioning guidelines](https://zellwk.com/blog/semantic-versioning/). Then run:

```
npm publish
```

This will run the `prepublishOnly` script and publish the new version to NPM.
