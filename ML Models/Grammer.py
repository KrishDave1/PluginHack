from gramformer import Gramformer
import os
from difflib import SequenceMatcher

def initialize_gramformer():
    """
    Initialize the Gramformer model.
    """
    gf = Gramformer(models=1, use_gpu=False)  # Use GPU if available
    return gf

def count_errors(original, corrected):
    """
    Count the number of errors based on differences between the original and corrected sentences.

    Args:
        original (str): Original sentence.
        corrected (str): Corrected sentence.

    Returns:
        int: The count of errors.
    """
    # Use SequenceMatcher to find differences
    matcher = SequenceMatcher(None, original.split(), corrected.split())
    error_count = 0

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag in ("replace", "delete"):  # If words were replaced or deleted, it's an error
            error_count += max(i2 - i1, j2 - j1)
    
    return error_count

def correct_sentence_with_error_count(gf, sentence):
    """
    Correct a sentence and count the errors.

    Args:
        gf (Gramformer): Initialized Gramformer model.
        sentence (str): Original sentence to correct.

    Returns:
        tuple: (corrected_sentence, error_count)
    """
    corrections = list(gf.correct(sentence))
    corrected_sentence = corrections[0] if corrections else sentence
    error_count = count_errors(sentence, corrected_sentence)
    
    return corrected_sentence, error_count

def process_text_file(file_path, output_path, gf):
    """
    Process a text file, calculate grammar errors, and save the corrected output.

    Args:
        file_path (str): Path to the input text file.
        output_path (str): Path to save the corrected output file.

    Returns:
        dict: A dictionary with error count, total sentences, and grammar score.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File '{file_path}' does not exist.")

    with open(file_path, "r", encoding="utf-8") as file:
        lines = file.readlines()

    corrected_sentences = []
    total_sentences = 0
    total_errors = 0

    for line in lines:
        sentences = line.strip().split(".")  # Split into sentences
        for sentence in sentences:
            if sentence.strip():  # Ignore empty sentences
                total_sentences += 1
                corrected, errors = correct_sentence_with_error_count(gf, sentence.strip())
                corrected_sentences.append(corrected)
                total_errors += errors

    # Save corrected sentences to output file
    with open(output_path, "w", encoding="utf-8") as file:
        file.write("\n".join(corrected_sentences))

    # Calculate grammar score
    grammar_score = ((total_sentences - total_errors) / total_sentences) * 100

    return {
        "total_sentences": total_sentences,
        "total_errors": total_errors,
        "grammar_score": grammar_score,
        "output_file": output_path,
    }

def main():
    """
    Main function to process a text file, calculate grammar score, and save corrected output.
    """
    print("Initializing the grammar correction model...")
    gf = initialize_gramformer()
    print("Model initialized successfully!")

    # Specify the input and output file paths
    input_file = r"C:\Users\mitta\OneDrive - iiit-b\Documents\PluginHack\ML Models\sample.txt"  # Replace with your input file path
    output_file = "corrected_output.txt"  # Replace with your desired output file path

    try:
        results = process_text_file(input_file, output_file, gf)

        print("\n--- Grammar Score Report ---")
        print(f"Total Sentences: {results['total_sentences']}")
        print(f"Errors Detected: {results['total_errors']}")
        print(f"Grammar Score: {results['grammar_score']:.2f}%")
        print(f"Corrected output saved to: {results['output_file']}")

    except FileNotFoundError as e:
        print(e)


if __name__ == "__main__":
    main()
