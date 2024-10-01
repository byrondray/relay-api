import * as admin from 'firebase-admin';
import * as serviceAccount from '../../serviceAccount.json';

console.log(serviceAccount, 'serviceAccount');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});
