import { createUGenFactory } from "../SCUgen";

export const MulAdd = createUGenFactory("MulAdd", {
  in: 0,
  mul: 1.0,
  add: 0.0,
});

export const CheckBadValues = createUGenFactory("CheckBadValues", {
  in: 0.0,
  id: 0,
  post: 2,
});

//, CheckBadValues, Poll, ScopeOut, SendTrig, LocalIn, LocalOut.
