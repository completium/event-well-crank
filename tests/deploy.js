const {
    deploy,
    getAccount,
    setQuiet,
    setEndpoint } = require('@completium/completium-cli');

setQuiet(false);
//setEndpoint('https://hangzhounet.smartpy.io');
setEndpoint('mockup');

let shaft;
let eventEmitter

let originator = getAccount("dappadmin");

describe("Deploy", async () => {
  it("Well", async () => {
    [shaft, _] = await deploy('./contract/shaft.arl', {  as: originator.pkh });
  });
  it("Event emitter", async () => {
    [eventEmitter, _] = await deploy('./tests/contracts/eventemitter.arl', {
      parameters : {
        well : shaft.address
      },
      as : originator.pkh
    })
  })
});
// describe("Emit", async () => {
//   it("Event { 1, 'test' }", async => {
//     eventEmitter.emit({
//       arg: {
//         i : 1,
//         s : "test"
//       }
//     })
//   })
// });

