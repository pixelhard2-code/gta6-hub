import { PROFILE_AVATARS } from "@/app/lib/avatars";
import styles from "./ProfileAvatarPicker.module.css";

export default function ProfileAvatarPicker({ value, onChange, currentPhoto, googlePhoto }: {
  value: string;
  onChange: (photo: string) => void;
  currentPhoto?: string | null;
  googlePhoto?: string | null;
}) {
  const isInPool = (photo: string) => PROFILE_AVATARS.some((avatar) => avatar.src === photo);
  const extraPhotos = [
    ...(currentPhoto && !isInPool(currentPhoto) ? [{ src: currentPhoto, name: "Mi foto actual" }] : []),
    ...(googlePhoto && googlePhoto !== currentPhoto && !isInPool(googlePhoto) ? [{ src: googlePhoto, name: "Mi foto de Google" }] : []),
  ];

  return <fieldset className={styles.picker}>
    <legend>Elige tu avatar</legend>
    <p>Cinco personajes estilo NFT para tu crew.</p>
    <div className={styles.pool}>
      {PROFILE_AVATARS.map((avatar) => <label key={avatar.id} className={styles.choice}>
        <input type="radio" name="profile-avatar" value={avatar.src} checked={value === avatar.src} onChange={() => onChange(avatar.src)} />
        <span className={styles.art}>
          {/* Local vector portraits preserve their detail at every avatar size. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatar.src} alt="" width={80} height={80} />
          {value === avatar.src && <span className={styles.check} aria-hidden="true">✓</span>}
        </span>
        <span className={styles.name}>{avatar.name}</span>
      </label>)}
    </div>
    {extraPhotos.map((photo) => <label className={styles.extra} key={photo.src}>
      <input type="radio" name="profile-avatar" value={photo.src} checked={value === photo.src} onChange={() => onChange(photo.src)} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.src} alt="" width={28} height={28} />
      <span>{photo.name}</span>
    </label>)}
  </fieldset>;
}
