const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors')
const app = express();
const port = 3001;

mongoose.connect('mongodb://localhost:27017/seat_reservation_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

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



app.post('/reserve', async (req, res) => {
    const { seatNumbers } = req.body;

    if (!seatNumbers || !Array.isArray(seatNumbers)) {
        return res.status(400).json({ error: 'Invalid request format' });
    }

    try {
        // Check seat availability
        const reservedSeats = await SeatReservation.find({ seatNumber: { $in: seatNumbers }, isReserved: false });

        if (reservedSeats.length > 0) {
            return res.status(400).json({ error: 'Some of the requested seats are already reserved' });
        }

        // Reserve the seats
        await SeatReservation.updateMany(
            { seatNumber: { $in: seatNumbers } },
            { $set: { isReserved: true } }
        );

        res.json({ message: 'Seats reserved successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

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


// Implement the logic to handle seat reservations here


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
