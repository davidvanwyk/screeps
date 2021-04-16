//@ts-ignore
function extendClass(base, extra) {
  const descriptors = Object.getOwnPropertyDescriptors(extra.prototype);
  delete descriptors.constructor;
  Object.defineProperties(base.prototype, descriptors);
}
