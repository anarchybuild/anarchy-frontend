
export const dataURLToFile = (dataURL: string, filename: string): File => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

export const createMetadataFile = (metadata: any, filename: string): File => {
  return new File(
    [JSON.stringify(metadata, null, 2)], 
    filename, 
    { type: 'application/json' }
  );
};

export const createDataURI = (data: any): string => {
  const jsonString = JSON.stringify(data);
  return `data:application/json;base64,${btoa(jsonString)}`;
};
