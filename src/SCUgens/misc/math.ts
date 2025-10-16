import { generateSCUgenBuilder } from "../SCUgen";

export const MulAdd = generateSCUgenBuilder(
  "MulAdd",
  {
    in: 0,
    mul: 1.0,
    add: 0.0,
  },
  (params) => [params.in, params.mul, params.add]
);

export const CheckBadValues = generateSCUgenBuilder(
  "CheckBadValues",
  {
    in: 0.0,
    id: 0,
    post: 2,
  },
  (params) => [params.in, params.id, params.post]
);

//, CheckBadValues, Poll, ScopeOut, SendTrig, LocalIn, LocalOut.
