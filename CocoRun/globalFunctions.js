// globalFunctions.js
let stopTrotCallback = () => {};

export const setStopTrotCallback = (callback) => {
  stopTrotCallback = callback;
};

export const triggerStopTrot = () => {
  stopTrotCallback();
  console.log('Trote detenido desde función global');
};