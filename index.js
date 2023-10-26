const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors')
const app = express();
const port = 3001;

// const { MongoClient }=require( 'mongodb');
// const records = Array.from({ length: 80 }, (_, i) => ({
//     seatNumber: i + 1,
//     isReserved: false,
//   }));
  
//   // Function to insert records
//   async function insertRecords() {
//     const client = new MongoClient("mongodb+srv://herumbn:herumb123@cluster0.ooacs0a.mongodb.net/?retryWrites=true&w=majority", { useUnifiedTopology: true });
  
//     try {
//       await client.connect();
  
//       const database = client.db("test"); // Replace with your database name
//       const collection = database.collection("seatreservations"); // Replace with your collection name
  
//       const result = await collection.insertMany(records);
//       console.log(`${result.insertedCount} records inserted.`);
//     } finally {
//       client.close();
//     }
//   }
  
//   // Call the insertRecords function
//   insertRecords().catch(console.error);

mongoose.connect('mongodb+srv://herumbn:herumb123@cluster0.ooacs0a.mongodb.net/?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then((connected) => {
        app.listen(port, () => {
            console.log(`Server is running on port ${port} and connected to db`);
        })


    }).catch((err) => {
        throw err
    })

const SeatReservation = mongoose.model('SeatReservation', {
    seatNumber: Number,
    isReserved: Boolean
});

app.use(express.json());
app.use(cors())

// API endpoints for seat reservations
app.post('/', (req, res) => {
    res.send("Hello there!")
})



app.put('/book', (req, res) => {

    const { seatNumber } = req.body
    const filter = { seatNumber: seatNumber }
    const update = {
        $set: { isReserved: true },
    }
    SeatReservation.findOneAndUpdate(filter, update, { new: true })
        .then((bookedSeat) => {
            if (bookedSeat) {
                console.log("Successfully booked");
                return res.status(200).send({ "message": "successful" });
            } else {
                return res.status(500).send({ "error": err });
            }
        })
        .catch((error) => {
            console.error(error);
        });
})





app.post('/bookMultiple', async (req, res) => {
    const { numSeats } = req.body;

    try {
        const availableSeat = await SeatReservation.findOne({ isReserved: false });

        if (!availableSeat) {
            return res.status(400).send("No available seats");
        }

        const seatNumber = availableSeat.seatNumber;

        if (80 - seatNumber + 1 < numSeats) {
            return res.status(400).send("Not enough seats available");
        }

        //checking if the the whole row can be booked
        // if (seatNumber % 7 <= numSeats) {    
        // seatNumber += seatNumber%7
        // }

        const seatNumbersToReserve = Array.from({ length: numSeats }, (_, i) => seatNumber + i);


        const filter = { seatNumber: { $in: seatNumbersToReserve } };
        const update = { $set: { isReserved: true } };
        const result = await SeatReservation.updateMany(filter, update);

        console.log('Update Result:', result); // Log the update result

        if (result.modifiedCount === numSeats) {
            return res.status(200).send({ message: `Seats booked successfully, ${seatNumbersToReserve}` });
        } else {
            return res.status(500).send({ error: "Failed to book seats" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: "Server error" });
    }
});

app.post('/cancelMultiple', async (req, res) => {
    const { numSeats } = req.body;

    try {
        const availableSeat = await SeatReservation.findOne({ isReserved: true });

        if (!availableSeat) {
            return res.status(400).send("No available seats");
        }

        const seatNumber = availableSeat.seatNumber;

        if (80 - seatNumber + 1 < numSeats) {
            return res.status(400).send("Not enough seats available");
        }



        const seatNumbersToReserve = Array.from({ length: numSeats }, (_, i) => seatNumber + i);


        const filter = { seatNumber: { $in: seatNumbersToReserve } };
        const update = { $set: { isReserved: false } };
        const result = await SeatReservation.updateMany(filter, update);

        console.log('Update Result:', result); // Log the update result

        if (result.modifiedCount === numSeats) {
            return res.status(200).send({ message: `Seats booked successfully, ${seatNumbersToReserve}` });
        } else {
            return res.status(500).send({ error: "Failed to book seats" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: "Server error" });
    }
});

app.get('/seats', (req, res) => {
    SeatReservation.find()
        .then((seats) => {
            if (seats) {
                res.send(seats)
            } else {
                console.log("No seats")
            }
        })
        .catch((error) => {
            console.error(error);
        });
})



