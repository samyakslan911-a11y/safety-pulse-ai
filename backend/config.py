from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str
    supabase_key: str
    roboflow_api_key: str = ""
    resend_api_key: str = ""
    email_from: str = "SafetyPulse AI <alerts@yourdomain.com>"
    storage_bucket: str = "violations"
    app_env: str = "development"

    class Config:
        env_file = ".env"

settings = Settings()
