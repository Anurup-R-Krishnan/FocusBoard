use sysinfo::System;

fn main() {
    let mut sys = System::new_all();
    sys.refresh_all();
    for (pid, process) in sys.processes() {
        let cpu = process.cpu_usage();
        let ram = process.memory(); // in bytes
        println!("PID: {} CPU: {}% RAM: {} bytes", pid.as_u32(), cpu, ram);
        break;
    }
}
