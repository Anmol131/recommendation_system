import React, { useState } from 'react';

export default function RecommendationCard({ item }) {
  const [imgFailed, setImgFailed] = useState(false);

  const imageSrc = item.poster || item.image || item.cover || item.albumArt || null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-800">
      <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
        {item.title}
      </h3>

      <div className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
        <p><span className="font-semibold">Type:</span> {item.type}</p>

        {item.year ? <p><span className="font-semibold">Year:</span> {item.year}</p> : null}
        {item.author ? <p><span className="font-semibold">Author:</span> {item.author}</p> : null}
        {item.artist ? <p><span className="font-semibold">Artist:</span> {item.artist}</p> : null}
        {item.album ? <p><span className="font-semibold">Album:</span> {item.album}</p> : null}
        {item.developer ? <p><span className="font-semibold">Developer:</span> {item.developer}</p> : null}
        {item.publisher ? <p><span className="font-semibold">Publisher:</span> {item.publisher}</p> : null}

        {item.genres && item.genres.length > 0 ? (
          <p><span className="font-semibold">Genres:</span> {item.genres.join(', ')}</p>
        ) : null}

        {item.categories && item.categories.length > 0 ? (
          <p><span className="font-semibold">Categories:</span> {item.categories.join(', ')}</p>
        ) : null}

        {item.description ? (
          <p className="pt-2 leading-6">
            <span className="font-semibold">Description:</span> {item.description}
          </p>
        ) : null}
      </div>

      {imageSrc && !imgFailed ? (
        <img
          src={imageSrc}
          alt={item.title}
          onError={() => setImgFailed(true)}
          className="mt-4 h-56 w-40 rounded-xl object-cover"
        />
      ) : null}

      {item.reasons && item.reasons.length > 0 ? (
        <div className="mt-4">
          <h4 className="mb-2 font-semibold text-slate-900 dark:text-white">
            Why recommended:
          </h4>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
            {item.reasons.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}