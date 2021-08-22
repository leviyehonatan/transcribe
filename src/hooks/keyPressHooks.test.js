const keyPressHooks = require("./keyPressHooks")
// @ponicode
describe("keyPressHooks.useMultiKeyPress", () => {
    test("0", () => {
        let callFunction = () => {
            keyPressHooks.useMultiKeyPress()
        }
    
        expect(callFunction).not.toThrow()
    })
})
