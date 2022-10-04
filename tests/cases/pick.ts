type t = { a: "b", c: "d", d: { a: "b" } }
type p = Pick<t, "a"|"d"> & {b: "asd", d: { b: "c" }}

const test3: p = {a: "b", b: "asd", d: { a: "b", b: "c" }}