## Binding generation

The [`test_bindings_gen.ts`](./test_bindings_gen.ts) has been generated with the command:
```bash
$ completium-cli generate bindings-ts ./contacts/testevent.arl > test_bindings_gen.ts
```

## Run `test.ts`

Edit [`test.ts`](./test.ts) and replace the `'YOUR_PRIVATE_KEY'` by your private key.

The following command displays the private key of your current account:
```bash
$ completium-cli show account --with-private-key
```

The execute from the project root directrory (`..` from here) the following commands:
```bash
$ npm i
$ npm run build
$ npm run test
```