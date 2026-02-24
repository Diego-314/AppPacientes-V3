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
    // Schema
let doctorSchema = new Schema({
    name: {type: String},
    password: {type: Buffer},
    user: {type: String},
    data: {type: Object}
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
        if (doctor == null) return res.send("<h3>No se ha encontrado su nombre de Usuario</h3>");
        let newPassword = zlib.inflateSync(doctor.password);
        if (password.trim() == newPassword) {
            console.log(doctor);
            return res.render("menu.ejs", { doctor })
        } else {
            return res.send('<h3>Contraseña incorrecta</h3>')
        };




    } catch (e) {
        console.log(e)
        res.send("Ha ocurrido un error.");
    }

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