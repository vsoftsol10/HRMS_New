// import { Link } from "react-router-dom";
// import { useState } from "react";

// export default function RegistrationPage() {
//   const [formData, setFormData] = useState({
//     fullName: "",
//     email: "",
//     password: "",
//     confirmPassword: "",
//   });

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     console.log(formData);
//     try {
//       const response = await fetch("http://localhost:5000/api/auth/register", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           email: formData.email,
//           password: formData.password,
//           role: "Employee",
//         }),
//       });
//       if (formData.password !== formData.confirmPassword) {
//         return alert("Passwords do not match");
//       }
//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.message);
//       }

//       alert("Registration Successful");
//     } catch (err) {
//       alert(err.message);
//     }
//   };
//   return (
//     <div className="min-h-screen flex bg-gray-50">
//       {/* Left Side */}{" "}
//       <div className="hidden lg:flex w-1/2 flex-col justify-center px-16 bg-white">
//         {" "}
//         <h1 className="text-5xl font-bold">
//           {" "}
//           <span className="text-yellow-500">V</span>Soft{" "}
//         </h1>
//         <h2 className="text-6xl font-bold mt-8">
//           Welcome to
//           <span className="text-yellow-500"> VSoft</span>
//         </h2>
//         <p className="text-gray-600 text-xl mt-4">
//           Human Resource Management System
//         </p>
//         <p className="text-gray-500 mt-8 max-w-lg">
//           Manage employees, attendance, payroll, leave, performance and company
//           operations securely from one intelligent platform.
//         </p>
//       </div>
//       {/* Right Side */}
//       <div className="w-full flex justify-center items-center p-6">
//         <div className="bg-white w-full p-10 rounded-lg shadow-lg">
//           <div className="text-center mb-10">
//             <h1 className="text-4xl font-bold">
//               <span className="text-yellow-500">V</span>Soft
//             </h1>

//             <h2 className="text-3xl font-bold mt-6">Create Your Account</h2>

//             <p className="text-gray-500 mt-2">Sign up to get started.</p>
//           </div>

//           <form
//             onSubmit={handleSubmit}
//             className="flex flex-col items-center"
//           >
//             <div className="w-2/3 flex flex-col">
//               <label className="font-medium">Full Name</label>

//               <input
//                 type="text"
//                 name="fullName"
//                 value={formData.fullName}
//                 onChange={handleChange}
//                 placeholder="Enter your full name"
//                 className="w-full border rounded-lg p-3 mt-2"
//               />
//             </div>

//             <div className="w-2/3 flex flex-col ">
//               <label className="font-medium">Email Address</label>

//               <input
//                 type="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 placeholder="Enter your email"
//                 className="w-full border rounded-lg p-3 mt-2"
//               />
//             </div>

//             <div className="w-2/3 flex flex-col">
//               <label className="font-medium">Password</label>

//               <input
//                 type="password"
//                 name="password"
//                 value={formData.password}
//                 onChange={handleChange}
//                 placeholder="Enter password"
//                 className="w-full border rounded-lg p-3 mt-2"
//               />
//             </div>

//             <div className="w-2/3 flex flex-col">
//               <label className="font-medium">Confirm Password</label>

//               <input
//                 type="password"
//                 name="confirmPassword"
//                 value={formData.confirmPassword}
//                 onChange={handleChange}
//                 placeholder="Confirm password"
//                 className="w-full border rounded-lg p-3 mt-2"
//               />
//             </div>

//             <button
//               type="submit"
//               className="w-2/3 bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg font-semibold"
//             >
//               Sign Up
//             </button>
//           </form>

//           <p className="text-center mt-6 text-gray-600">
//             Already have an account?
//             <Link to="/login" className="text-yellow-500 font-semibold ml-2">
//               Sign In
//             </Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }
