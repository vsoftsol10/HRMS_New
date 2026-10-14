import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const password = "Admin@123";
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create Admin Employee
  const employee = await prisma.employees.upsert({
    where: {
      employee_code: "ADM001",
    },
    update: {
      status: "Active",
      role: "Admin",
    },
    create: {
      employee_code: "ADM001",
      first_name: "Admin",
      gender: "Other",
      role: "Admin",
      status: "Active",
    },
  });

  // Create Admin User
  await prisma.users.upsert({
    where: {
      employee_id: employee.id,
    },
    update: {
      password: hashedPassword,
      role: "Admin",
      employee_code: employee.employee_code,
    },
    create: {
      employee_id: employee.id,
      employee_code: employee.employee_code,
      password: hashedPassword,
      role: "Admin",
    },
  });

  console.log("Admin seed completed successfully.");
  console.log("Employee Code:", "ADM001");
  console.log("Password:", password);
  console.log("Role:", "Admin");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });