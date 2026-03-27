const DEFAULTS = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.82,
};

const buildOutputName = (fileName, mimeType) => {
  const dotIndex = fileName.lastIndexOf('.');
  const base = dotIndex >= 0 ? fileName.slice(0, dotIndex) : fileName;
  if (mimeType === 'image/jpeg') return `${base}.jpg`;
  if (mimeType === 'image/png') return `${base}.png`;
  if (mimeType === 'image/webp') return `${base}.webp`;
  return fileName;
};

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };
    img.src = url;
  });

export const compressImageFile = async (file, options = {}) => {
  if (!file || !file.type || !file.type.startsWith('image/')) {
    return file;
  }

  const { maxWidth, maxHeight, quality } = { ...DEFAULTS, ...options };
  const image = await loadImage(file);

  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  if (!width || !height) return file;

  const resizeRatio = Math.min(1, maxWidth / width, maxHeight / height);
  const targetWidth = Math.max(1, Math.round(width * resizeRatio));
  const targetHeight = Math.max(1, Math.round(height * resizeRatio));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return file;

  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  const outputType = ['image/png', 'image/webp'].includes(file.type) ? file.type : 'image/jpeg';
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, outputType, quality));
  if (!blob) return file;

  // Avoid replacing the file if compression isn't beneficial.
  if (blob.size >= file.size) {
    return file;
  }

  return new File([blob], buildOutputName(file.name, outputType), {
    type: outputType,
    lastModified: Date.now(),
  });
};

