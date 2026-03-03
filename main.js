// Elementos utilizados
const express = require('express');
const mongoose = require('mongoose');
let app = express();
let path = require('path');
const ejs = require('ejs');
let { Schema } = require('mongoose');
let zlib = require('zlib');

// Base de Datos
mongoose.connect('mongodb+srv://AyaAya:yjIUOFUNct75aQSM@hitagibot.dsrxwp1.mongodb.net/AppPacientes-V3').then(() => {
    console.log('Conexión con la base de datos completada.')
}).catch((error) => {
    console.log('No fue posible conectarse a MongoDB.')
    console.log(error)
})

// Cookies de guardado de inicio de sesión
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
app.use(session({
    secret: "clave-super-secreta",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: "mongodb+srv://AyaAya:yjIUOFUNct75aQSM@hitagibot.dsrxwp1.mongodb.net/",
        collectionName: "sessions"
    }),
    cookie: {
        maxAge: 1000 * 60 * 60, // 1 hora
        httpOnly: true,
        secure: false
    }
}));

// Schema
let doctorSchema = new Schema({
    name: { type: String },
    password: { type: Buffer },
    user: { type: String },
    data: { type: Array }
});
let Doctor = mongoose.model('doctors', doctorSchema);


// Uso de EJS
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(process.cwd(), "public")));




// Rutas

//index
app.get("/", (req, res) => {
    return res.sendFile(path.join(__dirname, "views", 'logIn.html'));
});
// Se recibe la información del formulario logIn.html para iniciar sesión.
app.post("/logIn", async (req, res) => {
    try {
        let { user, password } = req.body;
        let doctor = await Doctor.findOne({ user: user.trim() })
        if (doctor == null) return res.render("Error.ejs", { title: "Cuenta no encontrada", body: "Revise su nombre de usuario o cree una cuenta nueva." })
        let newPassword = zlib.inflateSync(doctor.password);
        if (password.trim() == newPassword) {
            req.session.userId = doctor._id;
            return res.redirect('/inicio')
        } else {
            return res.render("Error.ejs", { title: "Contraseña incorrecta", body: "La contraseña ingresada es incorrecta. Por favor, retroceda e inténtelo nuevamente." })
        };
    } catch (e) {
        console.log(e)
        res.send("Ha ocurrido un error.");
    }
});

// Inicio

app.get('/inicio', async (req, res) => {
    if (!req.session.userId) return res.redirect("/logIn")
    let doctor = await Doctor.findById(req.session.userId)
        .select({ data: { $slice: 5 } });
    if (!doctor) return res.redirect("/login");
    return res.render('menu.ejs', { doctor })

});

// Crear una cuenta
app.get("/signUp", (req, res) => {
    return res.sendFile(path.join(__dirname, "views", 'signUp.html'));
});
app.get("/signUpError", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "signUpError.html"))
});
app.post("/signUp", async (req, res) => {
    try {
        let userExists = await Doctor.exists({ user: req.body.user });
        if (userExists == null) {
            let { user, password, name } = req.body;
            let compressedPassword = zlib.deflateSync(password.trim());
            let doctor1 = Doctor.create({
                user: user.trim(),
                password: compressedPassword,
                name: name.trim()
            });
            return res.redirect("/");
        };
        if (userExists) {
            return res.redirect("/signUpError");
        };
        console.log("Registro realizado con éxito.")
    } catch (e) {
        console.log(e);
        return res.send('Ha ocurrido un error. Comunícate con el desarrollador.')
    }
});


// Visualizador de pacientes 

app.get("/Pacientes", async (req, res) => {
    if (!req.session.userId) return res.redirect("/logIn")
    
    let page = parseInt(req.query.page) || 1;
    const limit = 20;
    const maxPage = 4;
    const skip = (page - 1) * limit;

    if (page < 1) page = 1;
    if (page > maxPage) page = 4;

    let doctor = await Doctor.findById(req.session.userId).select({ data: { $slice: [skip, limit] } })
    if (!doctor) return res.redirect("/logIn");

    return res.render('menu-pacientes.ejs', { doctor, page, maxPage });
    
});

// Crear pacientes

app.get('/crearPaciente', async (req, res) => {
    if (!req.session.userId) return res.redirect("/logIn")
    let doctor = await Doctor.findById(req.session.userId);
    if (!doctor) return res.redirect("/logIn");
    return res.sendFile(path.join(__dirname, 'views', 'crearPaciente.html'));
});
app.post('/crearPaciente', async (req, res) => {
    if (!req.session.userId) return res.redirect("/logIn")
    let doctor = await Doctor.findById(req.session.userId);
    if (!doctor) return res.redirect("/logIn");
    await Doctor.updateOne({ _id: req.session.userId }, { $push: { data: req.body } })
    return res.redirect('/Pacientes');
});


app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

// Configuraciones del puerto
let PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    try {
        console.log(`Página cargada en el puerto ${PORT}...`)
    } catch (e) {
        console.log(`Ha ocurrido un error en la reproducción de la página en el puerto ${PORT}`)
        console.log(e)
    }
});