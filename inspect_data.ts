import { collection, getDocs } from 'firebase/firestore';
import { db } from './src/lib/firebase';

async function checkData() {
  const querySnapshot = await getDocs(collection(db, 'accounts', 'mmspmartins62@gmail.com', 'camera_clients'));
  querySnapshot.forEach((doc) => {
    console.log(doc.id, " => ", JSON.stringify(doc.data()));
  });
}
checkData();
