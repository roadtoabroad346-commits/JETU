# Feature modules

Future feature modules compose UI and domain contracts. They may import public lib
utilities, never privileged clients. Route handlers call server services; server
services authorize each private operation and rely on RLS as defense in depth.
Do not create empty product tabs or duplicate source-of-truth stores.
