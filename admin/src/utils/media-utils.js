import { getDirectReticulumFetchUrl } from './phoenix-utils';

const getDirectMediaAPIEndpoint = () =>
  getDirectReticulumFetchUrl('/api/v1/media');

export const upload = (file, desiredContentType) => {
  const formData = new FormData();
  formData.append('media', file);
  formData.append('promotion_mode', 'with_token');

  if (desiredContentType) {
    formData.append('desired_content_type', desiredContentType);
  }

  // To eliminate the extra hop and avoid proxy timeouts, upload files directly
  // to a reticulum host.
  return fetch(getDirectMediaAPIEndpoint(), {
    method: 'POST',
    body: formData,
  }).then((r) => r.json());
};
