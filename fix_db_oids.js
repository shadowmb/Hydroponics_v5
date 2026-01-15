const mongoose = require('mongoose');

// Adjust URI if needed
const MONGO_URI = 'mongodb://127.0.0.1:27017/hydroponics';

async function fixCollection(collectionName, fieldsToCheck) {
    if (!mongoose.connection.db) return;
    const collection = mongoose.connection.db.collection(collectionName);
    const cursor = collection.find({});

    let fixedCount = 0;

    while (await cursor.hasNext()) {
        const doc = await cursor.next();
        let needsUpdate = false;
        const updateSet = {};

        // 1. Fix _id if needed
        if (doc._id && doc._id.$oid) {
            // Cannot update _id of existing doc easily in Mongo. 
            // We must insert new and delete old.
            const newId = new mongoose.Types.ObjectId(doc._id.$oid);
            const newDoc = { ...doc, _id: newId };

            // Fix other fields in newDoc before inserting
            for (const field of fieldsToCheck) {
                fixField(newDoc, field);
                // Also fix hardware.parentId nested patterns
                if (field.includes('.')) {
                    // split logic or manual handle
                }
            }

            // Manual fix for specific nested fields
            if (newDoc.hardware && newDoc.hardware.parentId && newDoc.hardware.parentId.$oid) {
                newDoc.hardware.parentId = new mongoose.Types.ObjectId(newDoc.hardware.parentId.$oid);
            }
            if (newDoc.hardware && newDoc.hardware.relayId && newDoc.hardware.relayId.$oid) {
                newDoc.hardware.relayId = new mongoose.Types.ObjectId(newDoc.hardware.relayId.$oid);
            }
            if (newDoc.controllerId && newDoc.controllerId.$oid) {
                newDoc.controllerId = new mongoose.Types.ObjectId(newDoc.controllerId.$oid);
            }

            // Insert new, delete old
            await collection.insertOne(newDoc);
            await collection.deleteOne({ _id: doc._id });
            fixedCount++;
            needsUpdate = false; // logic handled via swap
        } else {
            // Fix fields in place
            if (fixField(doc, 'hardware.parentId')) {
                updateSet['hardware.parentId'] = doc.hardware.parentId;
                needsUpdate = true;
            }
            if (fixField(doc, 'hardware.relayId')) {
                updateSet['hardware.relayId'] = doc.hardware.relayId;
                needsUpdate = true;
            }
            if (fixField(doc, 'controllerId')) {
                updateSet['controllerId'] = doc.controllerId;
                needsUpdate = true;
            }

            if (needsUpdate) {
                await collection.updateOne({ _id: doc._id }, { $set: updateSet });
                fixedCount++;
            }
        }
    }
    console.log(`✅ Fixed ${fixedCount} documents in ${collectionName}`);
}

function fixField(doc, path) {
    const parts = path.split('.');
    let target = doc;
    for (let i = 0; i < parts.length - 1; i++) {
        target = target[parts[i]];
        if (!target) return false;
    }
    const key = parts[parts.length - 1];

    // Check if target[key] matches expected bad pattern
    if (target[key] && target[key].$oid) {
        target[key] = new mongoose.Types.ObjectId(target[key].$oid);
        return true;
    }
    return false;
}

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        await fixCollection('controllers', []);
        await fixCollection('relays', ['controllerId']);
        await fixCollection('devices', ['hardware.parentId', 'hardware.relayId']);
        // Add Flows/Programs if needed (they use _id too)
        await fixCollection('flows', []);
        await fixCollection('programs', []);

        console.log('Done!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
