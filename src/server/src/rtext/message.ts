export namespace Message {

    export function serialize(obj: object) {
        escapeAllString(obj);
        const json = JSON.stringify(obj);
        return json.length + json;
    }

    function escapeAllString(obj: object) {
        forEachNested(Object.values(obj), (value) => {
            if (typeof value === 'string') {
                const bytes = Buffer.from(value);
                value = "";
                bytes.forEach((b) => {
                    if (b >= 128 || b == 0x25) { // %
                        value.concat(`%${b.toString(16)}`);
                    }
                    else {
                        value.concat(b);
                    }
                });
            }
            return true;
        }, null);
    }

    function forEachNested(O: any, f: (value: any) => boolean, cur: any) {
        O = [ O ]; // ensure that f is called with the top-level object
        while (O.length) // keep on processing the top item on the stack
            if(
               !f( cur = O.pop() ) && // do not spider down if `f` returns true
               cur instanceof Object && // ensure cur is an object, but not null
               [Object, Array].includes(cur.constructor) //limit search to [] and {}
            ) O.push.apply(O, Object.values(cur)); //search all values deeper inside
    }
}