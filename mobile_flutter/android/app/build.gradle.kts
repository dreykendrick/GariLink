import java.util.Properties

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val signingProperties = Properties().apply {
    val propertiesFile = rootProject.file("key.properties")
    if (propertiesFile.exists()) propertiesFile.inputStream().use(::load)
}

fun signingValue(property: String, environment: String): String? =
    (signingProperties.getProperty(property) ?: System.getenv(environment))
        ?.trim()
        ?.takeIf { it.isNotEmpty() }

val releaseStoreFile = signingValue("storeFile", "GARILINK_KEYSTORE_FILE")
val releaseStorePassword = signingValue("storePassword", "GARILINK_KEYSTORE_PASSWORD")
val releaseKeyAlias = signingValue("keyAlias", "GARILINK_KEY_ALIAS")
val releaseKeyPassword = signingValue("keyPassword", "GARILINK_KEY_PASSWORD")
val releaseSigningConfigured = listOf(
    releaseStoreFile,
    releaseStorePassword,
    releaseKeyAlias,
    releaseKeyPassword,
).all { it != null }

android {
    namespace = "ke.co.garilink.garilink_mobile"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        applicationId = "ke.co.garilink.garilink_mobile"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        if (releaseSigningConfigured) {
            create("release") {
                storeFile = rootProject.file(releaseStoreFile!!)
                storePassword = releaseStorePassword
                keyAlias = releaseKeyAlias
                keyPassword = releaseKeyPassword
            }
        }
    }

    buildTypes {
        release {
            if (releaseSigningConfigured) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }
}

tasks.matching { it.name == "preReleaseBuild" }.configureEach {
    doFirst {
        if (!releaseSigningConfigured) {
            throw GradleException(
                "Production signing is not configured. Copy android/key.properties.example " +
                    "to android/key.properties or set the GARILINK_KEYSTORE_* environment variables.",
            )
        }
        val keystore = rootProject.file(releaseStoreFile!!)
        if (!keystore.isFile) {
            throw GradleException("The configured GariLink release keystore does not exist.")
        }
    }
}

flutter {
    source = "../.."
}
