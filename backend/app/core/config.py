from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ReturnIQ API"
    app_version: str = "1.0.0"

    jwt_secret_key: str = "returniq-development-secret-key"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7

    ai_clip_model: str = "openai/clip-vit-base-patch32"
    ai_match_threshold: float = 0.35
    ai_review_threshold: float = 0.18
    ai_minimum_blur_score: float = 20.0
    ai_ocr_enabled: bool = True
    ai_damage_threshold: float = 0.28
    ai_minimum_image_width: int = 480
    ai_minimum_image_height: int = 480
    ai_minimum_brightness_score: float = 25.0
    ai_multi_image_agreement_threshold: float = 0.67
    ai_inconsistent_images_risk: int = 20
    ai_maximum_single_image_risk: int = 60
    ai_maximum_risk_adjustment: int = 70
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()