const mongoose = require('mongoose');

const id = "6923095fe196fdf33e033908";
const isValid = mongoose.Types.ObjectId.isValid(id);
console.log(`ID: "${id}"`);
console.log(`Length: ${id.length}`);
console.log(`Is Valid ObjectId: ${isValid}`);

try {
    const oid = new mongoose.Types.ObjectId(id);
    console.log(`Successfully created ObjectId: ${oid}`);
} catch (e) {
    console.error(`Failed to create ObjectId: ${e.message}`);
}
