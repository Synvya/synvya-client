"""
Profile API endpoints.
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from synvya_sdk import Profile

from app.dependencies import get_current_user, get_nostr_client

router = APIRouter()

RELAYS = ["wss://relay.primal.net"]


@router.get("/{public_key}")
async def get_profile(
    public_key: str, nostr_client=Depends(get_nostr_client)
) -> dict[str, Any]:
    """
    Get merchant profile by public key.

    Args:
        public_key: The public key of the profile to retrieve
        nostr_client: The global NostrClient instance

    Returns:
        Profile data as dictionary

    Raises:
        HTTPException: If profile retrieval fails
    """

    try:
        print(f"Retrieving profile for: {public_key}")

        # Use the global client to retrieve profile
        profile = await nostr_client.async_get_profile(public_key)
        print(f"Profile retrieved: {profile}")
        return profile.to_dict()
    except ValueError as e:
        # No profile found. Return empty profile structure with the public key
        print(f"No profile found: {e}")
        empty_profile = Profile(public_key)
        return empty_profile.to_dict()
    except Exception as e:
        print(f"Error retrieving profile: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve profile: {str(e)}"
        ) from e


@router.post("/")
async def create_or_update_profile(
    profile_data: dict[str, Any],
    user_pubkey: str = Depends(get_current_user),
    nostr_client=Depends(get_nostr_client),
) -> dict[str, Any]:
    """
    Create or update merchant profile.

    This endpoint receives profile data and publishes it to the Nostr network
    using the backend's delegated permissions via the global NostrClient.

    Args:
        profile_data: The profile data to publish
        user_pubkey: The authenticated user's public key
        nostr_client: The global NostrClient instance

    Returns:
        Success response with profile data

    Raises:
        HTTPException: If profile creation/update fails
    """

    try:
        print(f"Received profile data: {profile_data}")

        # Get the user's public key from the profile data or use authenticated user
        public_key = profile_data.get("public_key", user_pubkey)
        if not public_key:
            raise HTTPException(status_code=400, detail="public_key is required")

        # Ensure the public key matches the authenticated user for security
        if public_key != user_pubkey:
            raise HTTPException(
                status_code=403,
                detail="Profile public_key must match authenticated user",
            )

        # Check if we have a valid delegation for this user
        if not nostr_client.has_delegation_for(user_pubkey):
            raise HTTPException(
                status_code=403,
                detail="No valid delegation found for user. Please create a delegation first.",
            )

        print(f"Using global NostrClient with delegation for user: {user_pubkey}")

        # Create Profile object with the user's public key (the delegator)
        profile = Profile(user_pubkey)

        # Set profile fields from the received data
        profile.set_name(profile_data.get("name", ""))
        profile.set_display_name(profile_data.get("display_name", ""))
        profile.set_about(profile_data.get("about", ""))
        profile.set_street(profile_data.get("street", ""))
        profile.set_city(profile_data.get("city", ""))
        profile.set_zip_code(profile_data.get("zip_code", ""))
        profile.set_state(profile_data.get("state", ""))
        profile.set_country(profile_data.get("country", ""))
        profile.set_website(profile_data.get("website", ""))
        profile.set_email(profile_data.get("email", ""))
        profile.set_phone(profile_data.get("phone", ""))

        # Handle hashtags
        hashtags = profile_data.get("hashtags", [])
        if isinstance(hashtags, list):
            for hashtag in hashtags:
                if hashtag:  # Only add non-empty hashtags
                    profile.add_hashtag(hashtag)

        # Publish the profile using the global client with delegation
        success = await nostr_client.async_set_profile(profile)

        if success:
            print(f"Profile published successfully for {user_pubkey}")
            return {
                "success": str(success),
                "message": "Profile created/updated successfully",
                "profile": profile.to_dict(),
            }
        else:
            raise HTTPException(
                status_code=500, detail="Failed to publish profile to Nostr network"
            )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"Error creating/updating profile: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to create/update profile: {str(e)}"
        ) from e


@router.post("/upload-image")
async def upload_image(image_type: str, file_data: bytes) -> dict[str, str]:
    """
    Upload profile or banner image.

    TODO: Implement image upload
    - Validate image format and size
    - Upload to cloud storage (S3, Cloudinary, etc.)
    - Generate optimized versions (thumbnails, webp)
    - Return public URLs
    """
    return {
        "message": f"Image upload for {image_type} not implemented",
        "url": "",
        "thumbnail_url": "",
    }
