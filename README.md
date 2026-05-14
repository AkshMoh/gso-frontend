# Feature Selection in Software Fault Prediction using Glider Snake Optimization

## Project Overview
This project presents a comparative analysis of the **Glider Snake Optimization (GSO)** algorithm for feature selection in **Software Fault Prediction (SFP)**. SFP uses historical data and code metrics (such as McCabe and Halstead metrics) to identify fault-prone modules early in the development lifecycle.

The primary objective is to address the "curse of dimensionality" by selecting optimal subsets of features to improve machine learning classifier accuracy while significantly reducing computational overhead.

## Key Features
* **Novel Metaheuristic:** Implements Glider Snake Optimization (GSO), inspired by the multi-segment serpentine motion of arboreal snakes.
* **Superior Efficiency:** GSO is approximately **30 to 60 times faster** than traditional algorithms like GA and ACO, completing tasks in 10–40 seconds.
* **High Performance:** Achieves up to **90% error reduction** and maintains predictive accuracy with a significantly lower memory footprint.
* **Benchmarking:** Comparative evaluation against Genetic Algorithm (GA), Particle Swarm Optimization (PSO), Differential Evolution (DE), Ant Colony Optimization (ACO), and Secant Optimization Algorithm (SOA).
* **Comprehensive Testing:** Validated using 12 standardized **NASA MDP datasets** (e.g., CM1, JM1, KC1, PC3).

## System Requirements
### Hardware
* **Processor:** CPU-based system (Single or Multi-core).
* **Memory:** Minimum 8 GB RAM recommended.

### Software Stack
* **Language:** Python 3.9.12.
* **Core Libraries:** NumPy, Pandas, Scikit-learn, Matplotlib, Psutil.

## Implementation Workflow
1.  **Dataset Acquisition:** Retrieval of 12 NASA MDP datasets from the PROMISE repository.
2.  **Preprocessing:** Data cleaning, handling missing values, label conversion, and feature scaling using `StandardScaler'.
3.  **Wrapper-Based Selection:** Integration of classifiers (KNN, Naive Bayes, QDA, Random Forest) directly into the fitness function of metaheuristics.
4.  **Performance Evaluation:** Benchmarking using accuracy, precision, recall, and F1-score.

## Results Summary
* **Temporal Efficiency:** GSO consistently navigates search spaces in 10–40 seconds compared to 400–650 seconds for legacy algorithms.
* **Dimensionality Reduction:** Successfully achieves a reduction rate of **>40%** across diverse projects while maintaining or improving predictive accuracy.
* **Accuracy Peak:** Reached peak accuracies such as **97.77% on the PC2 dataset** using KNN/QDA.


# 📦 FSGSO-SFP-Research

 ┣ 📂 datasets   (Standardised)
 
 ┃ ┣ 📄 CM1.csv
 
 ┃ ┣ 📄 JM1.csv
 
 ┃ ┣ 📄 KC1.csv
 
 ┃ ┗ 📄 ... (all 12 datasets)
 
 ┃ 📜 GSO_ALL.ipynb
 
 ┃ 📜 ACO_all.ipynb
 
 ┃ 📜 GA_all.ipynb
 
 ┃ 📜 PSO_all.ipynb
 
 ┃ 📜 DE_all.ipynb
 
 ┃ 📜 SOA_all.ipynb
 
 ┣ 📜 requirements.txt 
 
 ┗ 📜 README.md             

# Installation Guide
To ensure all dependencies are installed correctly for the .ipynb files, run the following command in your terminal or command prompt:

pip install -r requirements.txt

# Execution Guide 
1. Navigate to your Project Directory : cd path\to\your\FSGSO_Project

2. Set Up a Virtual Environment (Recommended)
    :: Create the environment
    python -m venv venv

    :: Activate the environment
    venv\Scripts\activate

3. Install Dependencies : pip install -r requirements.txt

4. Launch the Jupyter Server
    Once the installation is complete, start the notebook server directly from the CMD:
    jupyter notebook

5. Running the Research Pipeline
    Select a Notebook: In the browser,open the .ipynb file.

    Kernel Check: Ensure the top right corner says "Python 3".

    Execute: You can run cells one by one using Shift + Enter or go to the top menu and select Cell > Run All.

## Authors
* Akshat Mohit
* Anushka Singh 
* Samriddhi 

**Project Guide:** Dr. Suchismita Das, School of Computer Engineering, KIIT University.

# Acknowledgments
Special thanks to the PROMISE Repository and the NASA Metrics Data Program (MDP) for the datasets used in this validation study.
## Model Files
