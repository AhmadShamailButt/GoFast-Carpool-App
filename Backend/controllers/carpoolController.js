const Ride = require("../models/Ride");
const Stop = require("../models/Stops");
delete require.cache[require.resolve("../models/User")];
const User = require("../models/User")

exports.getAllCarpools = async (req, res) => {
  try {
    const carpools = await Ride.find({ status: "active",numberOfSeats: { $gt: 0 } })
      .populate(
        "userId",
        "fullName department email gender rating rides_taken rides_offered"
      )
      .lean();
      

    const formattedCarpools = carpools.map((carpool) => ({
      id: carpool._id.toString(),
      driver: {
        id: carpool.userId._id.toString(),
        name: carpool.userId.fullName,
        gender: carpool.userId.gender,
        rating: carpool.userId.rating,
        department: carpool.userId.department,
      },
      route: {
         pickup: {
          name: carpool.pickup.name,
          latitude: carpool.pickup.latitude,
          longitude: carpool.pickup.longitude,
        },
        dropoff: {
          name: carpool.dropoff.name,
          latitude: carpool.dropoff.latitude,
          longitude: carpool.dropoff.longitude,
        },
      },
      schedule: {
        date: carpool.date.toISOString().split("T")[0], 
        time: carpool.time,
        recurring: [], 
      },
      seats: {
        total: carpool.numberOfSeats,
        available: carpool.numberOfSeats - (carpool.seatsTaken || 0),
      },
      preferences: carpool.preferences,
      _raw: carpool,
    }));

    res.status(200).json(formattedCarpools);
  } catch (error) {
    console.error("Error fetching carpools:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getCarpoolById = async (req, res) => {
  try {
    const carpool = await Ride.findById(req.params.id)
      .populate(
        "userId",
        "fullName department email gender rating rides_taken rides_offered"
      )
      .lean();

    if (!carpool) {
      return res.status(404).json({ message: "Carpool not found" });
    }

    const formattedCarpool = {
      id: carpool._id.toString(),
      driver: {
        id: carpool.userId._id.toString(),
        name: carpool.userId.fullName,
        gender: carpool.userId.gender,
        rating: carpool.userId.rating,
        department: carpool.userId.department,
      },
      route: {
        pickup: carpool.pickup.name,
        dropoff: carpool.dropoff.name,
      },
      schedule: {
        date: carpool.date.toISOString().split("T")[0],
        time: carpool.time,
        recurring: [],
      },
      seats: {
        total: carpool.numberOfSeats,
        available: carpool.numberOfSeats - (carpool.seatsTaken || 0),
      },
      preferences: carpool.preferences,
      _raw: carpool,
    };

    res.status(200).json(formattedCarpool);
  } catch (error) {
    console.error("Error fetching carpool:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.createCarpool = async (req, res) => {
  try {
    const { userId, pickup, dropoff, numberOfSeats, date, time, preferences } =
      req.body;

    const newRide = new Ride({
      userId,
      pickup,
      dropoff,
      numberOfSeats,
      date,
      time,
      preferences,
      status: "active",
    });

    const savedRide = await newRide.save();

    await User.findByIdAndUpdate(userId, { $inc: { rides_offered: 1 } });

    const populatedRide = await Ride.findById(savedRide._id)
      .populate(
        "userId",
        "fullName department email gender rating rides_taken rides_offered"
      )
      .lean();

    const formattedCarpool = {
      id: populatedRide._id.toString(),
      driver: {
        name: populatedRide.userId.fullName,
        gender: populatedRide.userId.gender,
        rating: populatedRide.userId.rating,
        department: populatedRide.userId.department,
      },
      route: {
        pickup: populatedRide.pickup.name,
        dropoff: populatedRide.dropoff.name,
      },
      schedule: {
        date: populatedRide.date.toISOString().split("T")[0],
        time: populatedRide.time,
        recurring: [],
      },
      seats: {
        total: populatedRide.numberOfSeats,
        available:
          populatedRide.numberOfSeats - (populatedRide.seatsTaken || 0),
      },
      preferences: populatedRide.preferences,
      _raw: populatedRide,
    };

    res.status(201).json(formattedCarpool);
  } catch (error) {
    console.error("Error creating carpool:", error);
    res.status(400).json({ message: error.message });
  }
};

exports.updateCarpool = async (req, res) => {
  try {
    const rideId = req.params.id;
    const updates = req.body;

    const existingRide = await Ride.findById(rideId).populate('userId');

    if (!existingRide) {
      return res.status(404).json({ message: "Carpool not found" });
    }

    if (updates.status === "inactive" && existingRide.status === "active") {
      const acceptedStops = await Stop.find({ rideId: rideId, status: "accept" }).populate('userId');

      for (const stop of acceptedStops) {
        if (stop.userId) {
          await User.findByIdAndUpdate(stop.userId._id, { $inc: { rides_taken: 1 } });
        }
      }
      if (existingRide.userId) {
        await User.findByIdAndUpdate(existingRide.userId._id, { $inc: { rides_offered: 1 } });
      }

      await Stop.updateMany({ rideId: rideId ,status:"pending"}, { $set: { status: 'decline' } });
    }

    const updatedRide = await Ride.findByIdAndUpdate(
      rideId,
      { $set: updates },
      { new: true }
    )
      .populate(
        "userId",
        "fullName department email gender rating rides_taken rides_offered"
      )
      .lean();

    if (!updatedRide) {
      return res.status(404).json({ message: "Carpool not found after update" });
    }

    const formattedCarpool = {
      id: updatedRide._id.toString(),
      driver: {
        name: updatedRide.userId.fullName,
        gender: updatedRide.userId.gender,
        rating: updatedRide.userId.rating,
        department: updatedRide.userId.department,
      },
      route: {
        pickup: {
          name: updatedRide.pickup.name,
          latitude: updatedRide.pickup.latitude,
          longitude: updatedRide.pickup.longitude,
        },
        dropoff: {
          name: updatedRide.dropoff.name,
          latitude: updatedRide.dropoff.latitude,
          longitude: updatedRide.dropoff.longitude,
        },
      },
      schedule: {
        date: updatedRide.date.toISOString().split("T")[0],
        time: updatedRide.time,
        recurring: [],
      },
      seats: {
        total: updatedRide.numberOfSeats,
        available: updatedRide.numberOfSeats - (updatedRide.seatsTaken || 0),
      },
      preferences: updatedRide.preferences,
      _raw: updatedRide,
    };

    res.status(200).json(formattedCarpool);
  } catch (error) {
    console.error("Error updating carpool:", error);
    res.status(400).json({ message: error.message });
  }
};
exports.deleteCarpool = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate(
        "userId",
        "fullName department email gender rating rides_taken rides_offered"
      )
      .lean();

    if (!ride) {
      return res.status(404).json({ message: "Carpool not found" });
    }

    await Ride.findByIdAndDelete(req.params.id);
    const formattedCarpool = {
      id: ride._id.toString(),
      driver: {
        name: ride.userId.fullName,
        gender: ride.userId.gender,
        rating: ride.userId.rating,
        department: ride.userId.department,
      },
      route: {
        pickup: ride.pickup.name,
        dropoff: ride.dropoff.name,
      },
      schedule: {
        date: ride.date.toISOString().split("T")[0],
        time: ride.time,
        recurring: [],
      },
      seats: {
        total: ride.numberOfSeats,
        available: ride.numberOfSeats - (ride.seatsTaken || 0),
      },
      preferences: ride.preferences,
      _raw: ride,
    };

    res.status(200).json(formattedCarpool);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.searchCarpools = async (req, res) => {
  try {
    const { pickup, dropoff, date, time, minSeats, filters, loggedInUserId } = req.body;

    console.log("Received search request with:", {
      pickup,
      dropoff,
      date,
      time,
      minSeats,
      filters,
      loggedInUserId,
    });

    const query = { status: "active" };

    if (pickup) {
      console.log("Pickup search term:", pickup);
      query["pickup.name"] = new RegExp(pickup, "i");
    }

    if (dropoff) {
      console.log("Dropoff search term:", dropoff);
      query["dropoff.name"] = new RegExp(dropoff, "i");
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      query.date = { $gte: startDate, $lte: endDate };
    }

    console.log("Initial query:", query);

    let rides = await Ride.find(query)
      .populate(
        "userId",
        "fullName department email gender rating rides_taken rides_offered department" // Ensure department is populated
      )
      .lean();

    console.log("Rides found before filtering:", rides);

    function convert12HourToMinutes(time12h) {
      const [time, modifier] = time12h.toLowerCase().split(" ");
      let [hours, minutes] = time.split(":").map(Number);
      if (modifier === "pm" && hours !== 12) hours += 12;
      if (modifier === "am" && hours === 12) hours = 0;
      return hours * 60 + minutes;
    }

    function convert24HourToMinutes(time24h) {
      const [hours, minutes] = time24h.split(":").map(Number);
      return hours * 60 + minutes;
    }

    if (time) {
      const targetMinutes = convert24HourToMinutes(time);
      rides = rides.filter((ride) => {
        const rideMinutes = convert12HourToMinutes(ride.time);
        return Math.abs(rideMinutes - targetMinutes) <= 30;
      });
      console.log("Rides after time filter:", rides);
    }

    if (minSeats) {
      rides = rides.filter((ride) => {
        const availableSeats = ride.numberOfSeats - (ride.seatsTaken || 0);
        return availableSeats >= minSeats;
      });
      console.log("Rides after minSeats filter:", rides);
    }

    if (filters && filters.length > 0) {
      rides = rides.filter((ride) => {
        let includeRide = true;
        if (filters.includes("Female drivers only") && ride.userId.gender !== "female") {
          includeRide = false;
        }
        if (filters.includes("Male drivers only") && ride.userId.gender !== "male") {
          includeRide = false;
        }
        if (filters.includes("No smoking") && (!ride.preferences || !ride.preferences.includes("No smoking"))) {
          includeRide = false;
        }
        return includeRide;
      });
      console.log("Rides after gender/smoking filters:", rides);

      if (filters.includes("Same department") ) {
        console.log("Applying 'Same Department' filter for userId:", loggedInUserId);
        const loggedInUser = await User.findById(loggedInUserId).lean();
        console.log("Logged in user details:", loggedInUser);
        if (loggedInUser && loggedInUser.department) {
          const loggedInDepartment = loggedInUser.department;
          rides = rides.filter(ride => {
            const driverDepartment = ride.userId ? ride.userId.department : null;
            const isSameDepartment = driverDepartment === loggedInDepartment;
            console.log(`Ride ID: ${ride._id}, Driver Department: ${driverDepartment}, Logged In Department: ${loggedInDepartment}, Same Department: ${isSameDepartment}`);
            return isSameDepartment;
          });
          console.log("Rides after 'Same Department' filter:", rides);
        } else {
          console.log("Could not retrieve logged-in user's department.");
        }
      }
    }

    const formattedCarpools = rides.map((ride) => ({
      id: ride._id.toString(),
      driver: {
        name: ride.userId.fullName,
        gender: ride.userId.gender,
        rating: ride.userId.rating,
        department: ride.userId.department,
      },
      route: {
        pickup: {
          name: ride.pickup.name,
          latitude: ride.pickup.latitude,
          longitude: ride.pickup.longitude,
        },
        dropoff: {
          name: ride.dropoff.name,
          latitude: ride.dropoff.latitude,
          longitude: ride.dropoff.longitude,
        },
      },
      schedule: {
        date: ride.date.toISOString().split("T")[0],
        time: ride.time,
        recurring: [],
      },
      seats: {
        total: ride.numberOfSeats,
        available: ride.numberOfSeats - (ride.seatsTaken || 0),
      },
      preferences: ride.preferences,
      _raw: ride,
    }));

    console.log("Formatted carpools for response:", formattedCarpools);
    res.status(200).json(formattedCarpools);
  } catch (error) {
    console.error("Error searching carpools:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getUpcomingRides = async (req, res) => {
  const userId = req.params.id;

  try {
    const ridesAsDriver = await Ride.find({ userId, status: "active" }).lean();

    const stopsAsPassenger = await Stop.find({ userId, status: "accept" }).lean();
    const rideIdsFromStops = stopsAsPassenger.map(stop => stop.rideId.toString());

    const ridesAsPassenger = await Ride.find({
      _id: { $in: rideIdsFromStops, $nin: ridesAsDriver.map(r => r._id.toString()) },
      status: "active"
    }).lean();
    const allRides = [...ridesAsDriver, ...ridesAsPassenger];

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const upcomingRides = [];
    for (const ride of allRides) {
      const rideDate = new Date(ride.date);
      rideDate.setHours(0, 0, 0, 0);

      if (rideDate >= currentDate) {
        upcomingRides.push(ride);
      } else {
        await Ride.findByIdAndUpdate(ride._id, { status: "inactive" });
      }
    }

    const ridesWithStops = await Promise.all(
      upcomingRides.map(async (ride) => {
        const stops = await Stop.find({ rideId: ride._id, status: "accept" }).lean();
        return { ...ride, stops };
      })
    );
    return res.json(ridesWithStops);

  } catch (error) {
    console.error("Error getting user rides:", error);
    return res.status(500).json({ error: "Server error while fetching rides" });
  }
};
