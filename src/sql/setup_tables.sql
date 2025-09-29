-- Script SQL para crear las tablas necesarias para la aplicación de control de acceso escolar
-- Ejecutar en el editor SQL de Supabase

-- Crear tipo enum para roles de usuario
CREATE TYPE user_role AS ENUM ('teacher', 'admin');

-- Tabla de profesores
CREATE TABLE teachers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'teacher',
    selected_group VARCHAR(255),
    meal_time VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de registros de comida
CREATE TABLE meal_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    group_name VARCHAR(255) NOT NULL,
    attendance_count INTEGER NOT NULL DEFAULT 0,
    total_students INTEGER NOT NULL DEFAULT 0,
    reinforcements_used INTEGER NOT NULL DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de estadísticas de asistencia
CREATE TABLE attendance_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    group_name VARCHAR(255) NOT NULL,
    attendance_count INTEGER NOT NULL DEFAULT 0,
    total_students INTEGER NOT NULL DEFAULT 0,
    reinforcements_used INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, group_name)
);

-- Tabla de configuración de refuerzos
CREATE TABLE reinforcement_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_name VARCHAR(255) NOT NULL UNIQUE,
    max_reinforcements INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de configuración de la aplicación
CREATE TABLE app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_meal_records_teacher_id ON meal_records(teacher_id);
CREATE INDEX idx_meal_records_date ON meal_records(date);
CREATE INDEX idx_meal_records_group_name ON meal_records(group_name);
CREATE INDEX idx_attendance_stats_date ON attendance_stats(date);
CREATE INDEX idx_attendance_stats_group_name ON attendance_stats(group_name);

-- Función para actualizar el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_teachers_updated_at
    BEFORE UPDATE ON teachers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_stats_updated_at
    BEFORE UPDATE ON attendance_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reinforcement_config_updated_at
    BEFORE UPDATE ON reinforcement_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at
    BEFORE UPDATE ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos iniciales
-- Usuario administrador por defecto
INSERT INTO teachers (name, password, role) 
VALUES ('Administrador', 'admin123', 'admin');

-- Configuración inicial de refuerzos para los grupos escolares
INSERT INTO reinforcement_config (group_name, max_reinforcements) VALUES 
-- Ciclo 1: Transición a 3° + Brújula 1 y 2
('Transición', 5),
('Jardín', 5),
('Pre-jardín', 5),
('1°', 5),
('2°', 5),
('3°', 5),
('Brújula 1', 3),
('Brújula 2', 3),

-- Ciclo 2: 4°-5° + Aceleración 1 y 2
('4°', 4),
('5°', 4),
('Aceleración 1', 3),
('Aceleración 2', 3),

-- Ciclo 3: 6°-8° + CS1
('6°', 3),
('7°', 3),
('8°', 3),
('CS1', 2),

-- Ciclo 4: 9°-11° + CS2
('9°', 2),
('10°', 2),
('11°', 2),
('CS2', 2),

-- Modalidad Técnica
('Técnico Sistemas', 2),
('Técnico Contabilidad', 2),
('Técnico Marketing', 2),
('Técnico Diseño', 2),
('Técnico Salud', 2),
('Técnico Agrícola', 2);

-- Configuración inicial de la aplicación
INSERT INTO app_settings (key, value) VALUES 
('app_version', '"1.0.0"'),
('initialized', 'true'),
('maintenance_mode', 'false');

-- Habilitar Row Level Security (RLS) para mayor seguridad
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE reinforcement_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (permitir todo por ahora, ajustar según necesidades)
CREATE POLICY "Allow all operations for teachers" ON teachers FOR ALL USING (true);
CREATE POLICY "Allow all operations for meal_records" ON meal_records FOR ALL USING (true);
CREATE POLICY "Allow all operations for attendance_stats" ON attendance_stats FOR ALL USING (true);
CREATE POLICY "Allow all operations for reinforcement_config" ON reinforcement_config FOR ALL USING (true);
CREATE POLICY "Allow all operations for app_settings" ON app_settings FOR ALL USING (true);
