require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db')
const morgan = require('morgan');
const path = require("path");


const app = express();
app.use(cors());
app.use(express.json())
app.use(morgan("tiny"))


//npm run build
if(process.env.NODE_ENV === "production"){
    app.use(express.static(path.join(__dirname, 'build')))
}


//Get all restaurants
app.get("/api/v1/restaurants", async (req, res) => {

    try {
        //const results = await db.query("SELECT * FROM restaurants;");
        const restaurantRatingsData = await db.query("SELECT * FROM restaurants left join (select restaurant_id, COUNT(*), TRUNC(AVG(rating), 1) as average_rating from reviews group by restaurant_id) reviews ON restaurants.id = reviews.restaurant_id;");

        
        res.status(200).json({
            status: "success",
            results: restaurantRatingsData.rows.length,
            data: {
                restaurants: restaurantRatingsData.rows
            },
        });
    } catch(err) {
        console.log(err)
    }

});

//Get individual restaurant
app.get("/api/v1/restaurants/:id", async(req, res) => {
    try {
        const restaurants = await db.query("SELECT * FROM restaurants left join (select restaurant_id, COUNT(*), TRUNC(AVG(rating), 1) as average_rating from reviews group by restaurant_id) reviews ON restaurants.id = reviews.restaurant_id WHERE id = $1", [req.params.id])
        const reviews = await db.query("SELECT * FROM reviews WHERE restaurant_id = $1", [req.params.id])

        res.status(200).json({
            status: "success",
            data: {
                restaurant: restaurants.rows[0],
                reviews: reviews.rows
            }
        })
    } catch(err){
        console.log(err)
    }

});

app.post("/api/v1/restaurants", async(req, res) => {
    try {
        console.log(req.body)
        const results = await db.query('INSERT INTO restaurants (name, location, price_range) values ($1, $2, $3) returning *', 
        [req.body.name, req.body.location, req.body.price_range])
        res.status(201).json({
            status: "success",
            data: {
                restaurant: results.rows[0]
            }
        })
    } catch(err){
        console.log(err)
    }

});


app.put("/api/v1/restaurants/:id", async(req,res) => {
    try {
        const results = await db.query("UPDATE restaurants SET name = $1, location = $2, price_range = $3 WHERE id = $4 returning *",
        [req.body.name, req.body.location, req.body.price_range, req.params.id])
        res.status(200).json({
            status: "success",
            data: {
                restaurant: results.rows[0]
            }
        })
    } catch(err){
        console.log(err)
    }

})

app.delete("/api/v1/restaurants/:id", async (req,res)=> {
    try {
        const response = await db.query("DELETE FROM restaurants WHERE id = $1", [req.params.id])
        res.status(204).json({
            status: "success"
        })
    } catch(err) {
        console.log(err)
    }

})

app.post("/api/v1/restaurants/:id/addReview", async (req, res) => {
    try {
        const newReview = await db.query("INSERT INTO reviews (restaurant_id, name, review, rating) VALUES ($1, $2, $3, $4) returning *;",
        [req.params.id, req.body.name, req.body.review, req.body.rating])
        res.status(201).json({
            status: 'succcess',
            data: {
                review: newReview.rows[0],
            }
        })
    } catch(err) {
        console.log(err)
    }
})

//add at bottom, "catch-all"
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
});

const port = process.env.PORT || 3001;
app.listen(port , () => {
    console.log(`Server is up and listening on port ${port}`);
});


