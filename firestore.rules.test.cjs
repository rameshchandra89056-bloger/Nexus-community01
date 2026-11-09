const fs = require('node:fs');
const path = require('node:path');
const { after, test } = require('node:test');
const {
  initializeTestEnvironment,
  assertFails,
} = require('@firebase/rules-unit-testing');
const {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} = require('firebase/firestore');

let testEnv;

async function getTestEnv() {
  if (!testEnv) {
    const rules = fs.readFileSync(
      path.join(__dirname, '..', 'firestore.rules'),
      'utf8'
    );

    testEnv = await initializeTestEnvironment({
      projectId: 'demo-nexus-v2',
      firestore: { rules },
    });
  }

  return testEnv;
}

test('unauthenticated clients cannot read or write Firestore', async () => {
  const env = await getTestEnv();
  const db = env.unauthenticatedContext().firestore();
  const accountRef = doc(db, 'nexus_accounts', 'sample-member');
  const postRef = doc(db, 'nexus_real_posts', 'sample-post');

  await assertFails(getDoc(accountRef));
  await assertFails(getDocs(collection(db, 'nexus_accounts')));
  await assertFails(setDoc(postRef, { text: 'test only' }));
  await assertFails(updateDoc(postRef, { text: 'changed' }));
  await assertFails(deleteDoc(postRef));
});

test('signed-in clients also remain denied until scoped rules are added', async () => {
  const env = await getTestEnv();
  const db = env.authenticatedContext('sample-auth-uid').firestore();
  const accountRef = doc(db, 'nexus_accounts', 'sample-member');
  const messageRef = doc(db, 'nexus_private_dms', 'sample-message');

  await assertFails(getDoc(accountRef));
  await assertFails(setDoc(accountRef, { username: 'sample-member' }));
  await assertFails(getDoc(messageRef));
  await assertFails(deleteDoc(messageRef));
});

after(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});
