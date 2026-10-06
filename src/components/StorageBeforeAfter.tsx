import React from 'react';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { useStorageUrl } from '../lib/storageUrl';

/** Comparador antes/después que acepta referencias de Storage (`sb://…`) o URLs antiguas. */
export const StorageBeforeAfter: React.FC<{ before?: string | null; after?: string | null }> = ({ before, after }) => (
  <BeforeAfterSlider beforeImage={useStorageUrl(before)} afterImage={useStorageUrl(after)} />
);
