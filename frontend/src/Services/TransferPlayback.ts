import axios from 'axios';
import { getValidAccessToken } from '../Utils/Login';
import { spotifyUrl } from '../config/endpoints';

/**
 * Transfer Spotify Connect playback to the given device without starting
 * playback (`PUT /v1/me/player` with `play: false`).
 *
 * Used by the wizard when the user picks a device from the device
 * picker before a `Play now`. The subsequent `PUT /me/player/play`
 * targets that device.
 *
 * @param deviceId - Spotify device id from `GetAvailableDevices`.
 * @returns `true` on 204, `false` on any error (404 unknown device,
 * 403 restriction, network).
 */
export const TransferPlayback = async (deviceId: string): Promise<boolean> => {
    const token = await getValidAccessToken();
    if (!token) return false;

    try {
        await axios.put(
            spotifyUrl('/me/player'),
            { device_ids: [deviceId], play: false },
            { headers: { Authorization: `Bearer ${token}` } },
        );
        return true;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error('Error transferring playback:', error.response?.data ?? error.message);
        } else {
            console.error('Error transferring playback:', error);
        }
        return false;
    }
};
