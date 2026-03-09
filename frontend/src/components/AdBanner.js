import React, { useEffect, useState } from 'react';
import api from '@/utils/api';

const AdBanner = ({ position = 'top' }) => {
  const [ad, setAd] = useState(null);

  useEffect(() => {
    api.get(`/advertisements?position=${position}`)
      .then(r => { if (r.data.length > 0) setAd(r.data[0]); })
      .catch(() => null);
  }, [position]);

  if (!ad) return null;

  const handleClick = () => {
    api.post(`/advertisements/${ad.id}/click`).catch(() => null);
  };

  return (
    <a
      href={ad.link_url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="block w-full overflow-hidden rounded-xl"
      data-testid="ad-banner"
    >
      <img
        src={ad.image_base64}
        alt={ad.title}
        className="w-full h-auto max-h-24 object-cover"
      />
    </a>
  );
};

export default AdBanner;
