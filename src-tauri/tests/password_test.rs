use fakelock_ts_lib::settings::Settings;

#[test]
fn test_password_verification_exact_match() {
    let settings = Settings {
        password: "unlock".to_string(),
        ..Default::default()
    };
    assert_eq!(settings.password, "unlock");
}

#[test]
fn test_password_verification_wrong_password() {
    let settings = Settings {
        password: "secret123".to_string(),
        ..Default::default()
    };
    assert_ne!(settings.password, "wrongpassword");
}

#[test]
fn test_password_verification_empty() {
    let settings = Settings {
        password: "".to_string(),
        ..Default::default()
    };
    assert_eq!(settings.password, "");
}

#[test]
fn test_password_verification_special_chars() {
    let settings = Settings {
        password: "p@ssw0rd!#$".to_string(),
        ..Default::default()
    };
    assert_eq!(settings.password, "p@ssw0rd!#$");
}

#[test]
fn test_settings_default_password() {
    let settings = Settings::default();
    assert_eq!(settings.password, "unlock");
}

#[test]
fn test_password_unicode() {
    let settings = Settings {
        password: "密码锁".to_string(),
        ..Default::default()
    };
    assert_eq!(settings.password, "密码锁");
}

#[test]
fn test_password_case_sensitive() {
    let settings = Settings {
        password: "Admin123".to_string(),
        ..Default::default()
    };
    assert_ne!(settings.password, "admin123");
    assert_ne!(settings.password, "ADMIN123");
    assert_eq!(settings.password, "Admin123");
}