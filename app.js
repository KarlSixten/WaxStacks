import 'dotenv/config';
import Discogs from 'disconnect';

const DISCOGS_TOKEN = process.env.DISCOGS_TOKEN;
const DISCOGS_USERNAME = process.env.DISCOGS_USERNAME;

const client = new Discogs.Client({
  userToken: DISCOGS_TOKEN
});

client.get(`/users/${DISCOGS_USERNAME}/collection/value`,
    (error, data) => {
      if (error) {
        console.error('Error fetching collection value:', error);
      } else {
        console.log('Collection value data:', data);
      }
    }
  );